import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";


export async function POST(request: Request) {
    // Connect to the database
    await dbConnect();
  
    try {
      // Extract user data from the request body
      const { username, email, password } = await request.json();
  
      // Check if username is already taken by a verified user
      const existingVerifiedUserByUsername = await UserModel.findOne({
        username,
        isVerified: true,
      });
  
      if (existingVerifiedUserByUsername) {
        // Return error if username is taken
        return Response.json(
          {
            success: false,
            message: 'Username is already taken',
          },
          { status: 400 }
        );
      }
  
      // Check if user with this email already exists
      const existingUserByEmail = await UserModel.findOne({ email });
      // Generate a 6-digit verification code
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  
      if (existingUserByEmail) {
        // If email exists and user is verified, return error
        if (existingUserByEmail.isVerified) {
          return Response.json(
            {
              success: false,
              message: 'User already exists with this email',
            },
            { status: 400 }
          );
        } else {
          // If email exists but user isn't verified, update their info
          const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
          existingUserByEmail.password = hashedPassword;
          existingUserByEmail.verifyCode = verifyCode;
          existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // Set expiry to 1 hour from now
          await existingUserByEmail.save();
        }
      } else {
        // If email doesn't exist, create a new user
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry to 1 hour from now
  
        // Create new user document
        const newUser = new UserModel({
          username,
          email,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpiry: expiryDate,
          isVerified: false,
          isAcceptingMessages: true, // Default to accepting messages
          messages: [], // Initialize empty messages array
        });
  
        await newUser.save();
      }
  
      // Send verification email to the user
      const emailResponse = await sendVerificationEmail(
        email,
        username,
        verifyCode
      );
      
      // Handle email sending failure
      if (!emailResponse.success) {
        return Response.json(
          {
            success: false,
            message: emailResponse.message,
          },
          { status: 500 }
        );
      }
  
      // Return success response if everything worked
      return Response.json(
        {
          success: true,
          message: 'User registered successfully. Please verify your account.',
        },
        { status: 201 }
      );
    } catch (error) {
      // Handle any unexpected errors
      console.error('Error registering user:', error);
      return Response.json(
        {
          success: false,
          message: 'Error registering user',
        },
        { status: 500 }
      );
    }
  }