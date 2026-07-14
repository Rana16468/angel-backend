import { FilterQuery, Query } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown> = {}) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // 🔍 Search only string fields
  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm as string;

    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      } as FilterQuery<T>);
    }

    return this;
  }

  // 🎯 Filter (supports seen=true/false)
  filter() {
    let queryObject: any = { ...this.query };

    // ✅ Boolean filter for seen
    if (this.query.seen !== undefined) {
      queryObject.seen = this.query.seen === "true";
    }

    // Price filter example
    if (this.query.maxPrice && this.query.minPrice) {
      queryObject.price = {
        $gte: Number(this.query.minPrice),
        $lte: Number(this.query.maxPrice),
      };
    }

    // Date filter example
    if (this.query?.releaseDate) {
      queryObject.releaseDate = {
        $gte: this.query.releaseDate as string,
        $lte: this.query.releaseDate as string,
      };
    }

    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((el) => delete queryObject[el]);

    this.modelQuery = this.modelQuery.find(queryObject as FilterQuery<T>);
    return this;
  }

  // ⬇️ Sort
  sort() {
    const sortBy =
      (this.query?.sort as string)?.split(",").join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sortBy);
    return this;
  }

  // 📄 Pagination
  paginate() {
    const limit = Math.max(Number(this.query?.limit ?? 10), 1);
    const page = Math.max(Number(this.query?.page ?? 1), 1);
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // 🎯 Fields select
  fields() {
    const fields =
      (this.query?.fields as string)?.split(",").join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // 📊 Meta count
  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Math.max(Number(this.query?.page ?? 1), 1);
    const limit = Math.max(Number(this.query?.limit ?? 10), 1);
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
