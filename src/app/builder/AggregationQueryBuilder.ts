
import mongoose, { Model, PipelineStage } from "mongoose";
import joingroups, { joinusers } from "../modules/join_event_group/join_event_group.model";
import status from "http-status";
import AppError from "../errors/AppError";


/* ---------------- AggregationQueryBuilder ---------------- */
class AggregationQueryBuilder<T> {
  private model: Model<T>;
  private pipeline: PipelineStage[];
  private query: Record<string, unknown>;

  constructor(model: Model<T>, pipeline: PipelineStage[] = [], query: Record<string, unknown> = {}) {
    this.model = model;
    this.pipeline = pipeline;
    this.query = query;
  }

  /* ---------------- SEARCH ---------------- */
  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm as string;
    if (searchTerm && searchableFields.length) {
      this.pipeline.push({
        $match: {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: searchTerm, $options: "i" },
          })),
        },
      });
    }
    return this;
  }

  /* ---------------- FILTER ---------------- */
  filter() {
    let match: any = {};
    if (this.query.minPrice && this.query.maxPrice) {
      match.price = { $gte: Number(this.query.minPrice), $lte: Number(this.query.maxPrice) };
    }
    if (this.query.releaseDate) {
      match.releaseDate = { $gte: this.query.releaseDate, $lte: this.query.releaseDate };
    }
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((el) => delete this.query[el]);
    if (Object.keys(match).length) this.pipeline.push({ $match: match });
    return this;
  }

  /* ---------------- SORT ---------------- */
  sort() {
    const sortBy =
      (this.query?.sort as string)
        ?.split(",")
        .reduce((acc: any, field) => {
          acc[field.startsWith("-") ? field.slice(1) : field] = field.startsWith("-") ? -1 : 1;
          return acc;
        }, {}) || { createdAt: -1 };
    this.pipeline.push({ $sort: sortBy });
    return this;
  }

  /* ---------------- PAGINATE ---------------- */
  paginate() {
    const limit = Math.max(Number(this.query?.limit ?? 10), 1);
    const page = Math.max(Number(this.query?.page ?? 1), 1);

    const skip = (page - 1) * limit;
    this.pipeline.push({ $skip: skip }, { $limit: limit });
    return this;
  }

  /* ---------------- PROJECT FIELDS ---------------- */
  fields() {
    if (this.query?.fields) {
      const projection = (this.query.fields as string)
        .split(",")
        .reduce((acc: any, field) => {
          acc[field] = 1;
          return acc;
        }, {});
      this.pipeline.push({ $project: projection });
    }
    return this;
  }

  /* ---------------- EXECUTE ---------------- */
  async data() {
    return this.model.aggregate(this.pipeline);
  }

  /* ---------------- META COUNT ---------------- */
  async countTotal() {
    // create a clean pipeline for counting
    const countPipeline = this.pipeline.filter((stage) => {
      const key = Object.keys(stage)[0];
      return key !== "$skip" && key !== "$limit" && key !== "$project" && key !== "$sort";
    });
    countPipeline.push({ $count: "total" });

    const result = await this.model.aggregate(countPipeline);
    const total = result[0]?.total ?? 0;
    const page = Math.max(Number(this.query?.page ?? 1), 1);
    const limit = Math.max(Number(this.query?.limit ?? 10), 1);
    const totalPage = Math.ceil(total / limit);

    return { page, limit, total, totalPage };
  }
}

export default AggregationQueryBuilder;

/* ---------------- find_my_join_group_IntoDb ---------------- */