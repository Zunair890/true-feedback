import UserModel from "@/models/User";

import dbConnect from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";



export async function POST(request:Request){
    await dbConnect();

    const session= await getServerSession(authOptions);
    const user= session?.user;
    if(!session  || !session.user){
 return Response.json({
    success: false,
    message:"Not Authenicated!"
 },{status:401})
    }

    const userId=user._id;
    const {acceptMessages}= await request.json();
    try {
        const updatedUser= await UserModel.findByIdAndUpdate(userId,{isAcceptingMessages:acceptMessages},{new:true});
        if (!updatedUser) {
            return Response.json(
              {
                success: false,
                message: 'Unable to find user to update message acceptance status',
              },
              { status: 404 } // 404 Not Found status code
            );
          }
      
          // Return success response with updated user data
          return Response.json(
            {
              success: true,
              message: 'Message acceptance status updated successfully',
              updatedUser, // Include the updated user object
            },
            { status: 200 } // 200 OK status code
          );
    } catch (error) {
        // Log and handle any errors
        console.error('Error updating message acceptance status:', error);
        return Response.json(
          { success: false, message: 'Error updating message acceptance status' },
          { status: 500 } // 500 Internal Server Error
        );
      }
    
}

export async function GET(request: Request) {
    // Connect to MongoDB database
    await dbConnect();
  
    // Get the current user session
    const session = await getServerSession(authOptions);
    const user = session?.user;
  
    // Check if user is authenticated
    if (!session || !user) {
      return Response.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 } // 401 Unauthorized status code
      );
    }
  
    try {
      // Find user in database using ID from session
      const foundUser = await UserModel.findById(user._id);
  
      // If user not found in database
      if (!foundUser) {
        return Response.json(
          { success: false, message: 'User not found' },
          { status: 404 } // 404 Not Found status code
        );
      }
  
      // Return the user's message acceptance status
      return Response.json(
        {
          success: true,
          isAcceptingMessages: foundUser.isAcceptingMessages, // Current status
        },
        { status: 200 } // 200 OK status code
      );
    } catch (error) {
      // Log and handle any errors
      console.error('Error retrieving message acceptance status:', error);
      return Response.json(
        { success: false, message: 'Error retrieving message acceptance status' },
        { status: 500 } // 500 Internal Server Error
      );
    }
  }