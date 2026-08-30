import httpStatus from 'http-status';

import users from './user.model';
import { USER_ACCESSIBILITY } from './user.constant';
import { TUser } from './user.interface';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import sendEmail from '../../utils/sendEmail';
import emailContext from '../../utils/emailcontext/sendvarificationData';
import { jwtHelpers } from '../../helper/jwtHelpers';
import config from '../../config';

/**
 * Progressive OTP Resend Cooldown:
 * 1st request -> 10s cooldown
 * 2nd request -> 30s cooldown
 * 3rd request -> 60s (1 min) cooldown
 * 4th+ requests -> 60s (1 min) cooldown
 */
const calculateOtpCooldown = (count: number): number => {
  if (count <= 1) return 10;
  if (count === 2) return 30;
  return 60;
};

const validateOtpCooldown = (
  lastOtpSentAt?: Date,
  otpRequestCount: number = 0
): { nextAttemptCount: number; cooldownSeconds: number } => {
  const now = Date.now();
  if (lastOtpSentAt) {
    const lastSentTime = new Date(lastOtpSentAt).getTime();
    const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);
    const RESET_WINDOW_SECONDS = 15 * 60; // 15 minutes of inactivity resets cooldown cycle

    if (elapsedSeconds < RESET_WINDOW_SECONDS) {
      const currentCooldown = calculateOtpCooldown(otpRequestCount);
      if (elapsedSeconds < currentCooldown) {
        const remainingSeconds = currentCooldown - elapsedSeconds;
        throw new AppError(
          httpStatus.TOO_MANY_REQUESTS,
          `Please wait ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''} before requesting a new OTP.`,
          ''
        );
      }
      const nextAttemptCount = (otpRequestCount || 1) + 1;
      return {
        nextAttemptCount,
        cooldownSeconds: calculateOtpCooldown(nextAttemptCount),
      };
    }
  }

  return {
    nextAttemptCount: 1,
    cooldownSeconds: calculateOtpCooldown(1),
  };
};

const generateUniqueOTP = async (): Promise<number> => {
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const otp = Math.floor(100000 + Math.random() * 900000);

    const existingUser = await users.findOne({ verificationCode: otp });

    if (!existingUser) {
      return otp;
    }
  }

  throw new AppError(
    httpStatus.NOT_EXTENDED,
    "Failed to generate a unique OTP after multiple attempts",
    ""
  );
};


const createUserIntoDb = async (payload: TUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isExistUser = await users.findOne({
      email: payload?.email,
      isDelete: false,
    });

    if (isExistUser && isExistUser.isVerify) {
      throw new AppError(
        httpStatus.CONFLICT, // 409
        'This email already exists in our database',
        '',
      );
    }

    const otp = await generateUniqueOTP();
    const now = new Date();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // If an unverified account already exists, update and resend with cooldown check
    if (isExistUser && !isExistUser.isVerify) {
      const { nextAttemptCount, cooldownSeconds } = validateOtpCooldown(
        isExistUser.lastOtpSentAt,
        isExistUser.otpRequestCount || 0
      );

      if (payload.password) {
        payload.password = await bcrypt.hash(
          payload.password,
          Number(config.bcrypt_salt_rounds)
        );
      }

      await users.updateOne(
        { _id: isExistUser._id },
        {
          $set: {
            ...payload,
            verificationCode: otp,
            otpRequestCount: nextAttemptCount,
            lastOtpSentAt: now,
            otpExpiresAt,
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await sendEmail(
        payload.email,
        emailContext.sendVerificationData(
          payload.name || payload.email,
          otp,
          'User Verification Email',
        ),
        'Verification OTP Code',
      );

      return {
        status: true,
        message: 'Check your email inbox for verification code',
        cooldownSeconds,
      };
    }

    const { nextAttemptCount, cooldownSeconds } = validateOtpCooldown(undefined, 0);

    payload.verificationCode = otp;
    payload.otpRequestCount = nextAttemptCount;
    payload.lastOtpSentAt = now;
    payload.otpExpiresAt = otpExpiresAt;
    payload.subname = `${payload.name.toLowerCase().replace(/\s+/g, "_")}_${Math.floor(1000 + Math.random() * 9000)}`;

    const authBuilder = new users(payload);
    const result = await authBuilder.save({ session });
    if(!result){
      throw new  AppError(httpStatus.NOT_EXTENDED,'issues  by the information recorded  section server')
    }

    await session.commitTransaction();
    session.endSession();

    // Send email AFTER successful commit
    await sendEmail(
      payload.email,
      emailContext.sendVerificationData(
        payload.name || payload.email,
        otp,
        'User Verification Email',
      ),
      'Verification OTP Code',
    );


    return {
      status: true,
      message: 'Check your email inbox for verification code',
      cooldownSeconds,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof AppError) {
      throw error; // preserve custom error
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unexpected server error',
      error,
    );
  }
};


const userVarificationIntoDb = async (verificationCode: number) => {
  try {
    if (!verificationCode) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Verification code is required',
        '',
      );
    }

    const isExistUser = await users.findOne({ verificationCode, isDelete: false });

    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, 'Invalid verification code', '');
    }

    if (isExistUser.otpExpiresAt && new Date() > new Date(isExistUser.otpExpiresAt)) {
      throw new AppError(
        httpStatus.GONE,
        'OTP has expired. Please request a new one.',
        ''
      );
    }

    const updatedUser = await users.findByIdAndUpdate(
      isExistUser._id,
      {
        $set: {
          isVerify: true,
          otpRequestCount: 0,
          lastOtpSentAt: null,
        },
        $unset: {
          verificationCode: '',
          otpExpiresAt: '',
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new AppError(httpStatus.NOT_FOUND, 'User verification failed', '');
    }

    const jwtPayload = {
      id: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
    };

    let accessToken: string | null = null;

    if (updatedUser.isVerify) {
      accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.expires_in as string,
      );
    }

    return {
      message: 'User verification successful',
      accessToken,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Verification auth error',
      error,
    );
  }
};

const resendOtpIntoDb = async (payload: { email: string }) => {
  const { email } = payload;
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is required', '');
  }

  const isExistUser = await users.findOne({
    email,
    isDelete: false,
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found with this email', '');
  }

  // Progressive cooldown check
  const { nextAttemptCount, cooldownSeconds } = validateOtpCooldown(
    isExistUser.lastOtpSentAt,
    isExistUser.otpRequestCount || 0
  );

  const otp = await generateUniqueOTP();
  const now = new Date();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await users.updateOne(
    { _id: isExistUser._id },
    {
      $set: {
        verificationCode: otp,
        otpRequestCount: nextAttemptCount,
        lastOtpSentAt: now,
        otpExpiresAt,
      },
    }
  );

  const emailSubject = isExistUser.isVerify
    ? 'Forgot Password Verification OTP Code'
    : 'Verification OTP Code';
  const emailContextTitle = isExistUser.isVerify
    ? 'Forgot Password Verification Code'
    : 'User Verification Email';

  await sendEmail(
    email,
    emailContext.sendVerificationData(
      isExistUser.name || email,
      otp,
      emailContextTitle
    ),
    emailSubject
  );

  return {
    status: true,
    message: `Verification code sent to your email. Next resend available in ${cooldownSeconds}s.`,
    cooldownSeconds,
  };
};

const chnagePasswordIntoDb = async (
  payload: {
    newpassword: string;
    oldpassword: string;
  },
  id: string,
) => {
  try {
    const isUserExist = await users.findOne(
      {
        $and: [
          { _id: id },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          { isDelete: false },
        ],
      },
      { password: 1 },
    );

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found', '');
    }

    if (
      !(await users.isPasswordMatched(
        payload.oldpassword,
        isUserExist?.password,
      ))
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Old password does not match',
        '',
      );
    }

    const newHashedPassword = await bcrypt.hash(
      payload.newpassword,
      Number(config.bcrypt_salt_rounds),
    );

    const updatedUser = await users.findByIdAndUpdate(
      id,
      { password: newHashedPassword },
      { new: true, upsert: true },
    );
    if (!updatedUser) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'password  change database error',
        '',
      );
    }

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Password change failed',
      error,
    );
  }
};

const forgotPasswordIntoDb = async (payload: string | { email: string }) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    let emailString: string;

    if (typeof payload === 'string') {
      emailString = payload;
    } else if (payload && typeof payload === 'object' && 'email' in payload) {
      emailString = payload.email;
    } else {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid email format', '');
    }

    const isExistUser = await users.findOne(
      {
        $and: [
          { email: emailString },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          { isDelete: false },
        ],
      },
      { _id: 1, name: 1, provider: 1, lastOtpSentAt: 1, otpRequestCount: 1 },
      { session },
    );

    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found', '');
    }

    // Progressive cooldown check
    const { nextAttemptCount, cooldownSeconds } = validateOtpCooldown(
      isExistUser.lastOtpSentAt,
      isExistUser.otpRequestCount || 0
    );

    const otp = await generateUniqueOTP();
    const now = new Date();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const result = await users.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        $set: {
          verificationCode: otp,
          otpRequestCount: nextAttemptCount,
          lastOtpSentAt: now,
          otpExpiresAt,
        },
      },
      {
        new: true,
        projection: { _id: 1, email: 1 },
        session,
      },
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'OTP forgot section issues', '');
    }

    try {
      await sendEmail(
        emailString,
        emailContext.sendVerificationData(
          isExistUser.name || emailString,
          otp,
          'Forgot Password Email',
        ),
        'Forgot Password Verification OTP Code',
      );
    } catch (emailError: any) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Failed to send verification email',
        emailError,
      );
    }


    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: 'Checked Your Email',
      cooldownSeconds,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Password change failed',
      error,
    );
  }
};

const verificationForgotUserIntoDb = async (
  otp: number | { verificationCode: number },
): Promise<string> => {
  try {
    let code: number;

    if (typeof otp === 'object' && typeof otp.verificationCode === 'number') {
      code = otp.verificationCode;
    } else if (typeof otp === 'number') {
      code = otp;
    } else {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP format', '');
    }

    const isExistOtp: any = await users.findOne(
      {
        $and: [
          { verificationCode: code },
          { isVerify: true },
          { isDelete: false },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { _id: 1, updatedAt: 1, email: 1, role: 1, otpExpiresAt: 1 },
    );

    if (!isExistOtp) {
      throw new AppError(httpStatus.NOT_FOUND, 'OTP not found', '');
    }

    if (isExistOtp.otpExpiresAt && new Date() > new Date(isExistOtp.otpExpiresAt)) {
      throw new AppError(
        httpStatus.GONE,
        'OTP has expired. Please request a new one.',
        ''
      );
    }

    const jwtPayload = {
      id: isExistOtp._id.toString(),
      role: isExistOtp.role,
      email: isExistOtp.email,
    };

    const accessToken = jwtHelpers.generateToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.expires_in as string,
    );

    await users.updateOne(
      { _id: isExistOtp._id },
      {
        $unset: { verificationCode: '', otpExpiresAt: '' },
        $set: { otpRequestCount: 0, lastOtpSentAt: null },
      },
    );

    return accessToken;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Password change failed',
      error,
    );
  }
};

const resetPasswordIntoDb = async (payload: {

  userId: string;
  password: string;
}) => {
  try {
    const isExistUser = await users.findOne(
      {
        $and: [
          { _id: payload.userId },
          { isVerify: true },
          { isDelete: false },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { _id: 1 },
    );
    if (!isExistUser) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'some issues by the  reset password section',
        '',
      );
    }
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds),
    );

    const result = await users.findByIdAndUpdate(
      isExistUser._id,
      { password: payload.password },
      { new: true, upsert: true },
    );
    return result && { status: true, message: 'successfylly reset password' };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'server unavailable  reset password into db function',
      error,
    );
  }
};

const googleAuthIntoDb = async (payload: TUser) => {
  try {
   
    let user = await users.findOne(
      {
        email: payload.email,
        isVerify: true,
        isDelete: false,
      },
      { _id: 1, role: 1, email: 1, isVerify: 1, },
    );

    let jwtPayload: { id: string; role: string; email: string };

    if (!user) {
     
      payload.isVerify = true;
      payload.subname = `${payload.name.toLowerCase().replace(/\s+/g, "_")}_${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newUser = new users(payload);
      user = await newUser.save();
    }

    jwtPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    if (user.isVerify) {
      const accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.expires_in as string,
      );

      const refreshToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.refresh_expires_in as string,
      );

      // Update FCM token if provided
      if (payload?.fcm) {
        await users.findByIdAndUpdate(user._id, { $set: { fcm: payload.fcm } },{new:true, upsert:true});
      }

      return { accessToken, refreshToken };
    }

    // If user is not verified
    return { accessToken: null, refreshToken: null };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      error.message || "Google auth failed",
      error,
    );
  }
};

const UserServices = {
  createUserIntoDb,
  userVarificationIntoDb,
  resendOtpIntoDb,
  chnagePasswordIntoDb,
  forgotPasswordIntoDb,
  verificationForgotUserIntoDb,
  resetPasswordIntoDb,
  googleAuthIntoDb,
};

export default UserServices;

