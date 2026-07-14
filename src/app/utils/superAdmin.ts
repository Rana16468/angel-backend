import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { superAdminCredentials, USER_ROLE } from "../modules/user/user.constant";
import users from "../modules/user/user.model";

const createOrUpdateSuperAdmin = async (): Promise<void> => {
  try {
    const result = await users.findOneAndUpdate(
      { email: superAdminCredentials.email },
      {
        $set: {
          ...superAdminCredentials,
          role: USER_ROLE.superAdmin,
        },
      },
      { new: true, upsert: true }
    );

    if (!result) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create or update the Super Admin record."
      );
    }

    
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Error occurred during Super Admin creation or update.",
      error?.message || "Unknown error"
    );
  }
};

export default createOrUpdateSuperAdmin;
