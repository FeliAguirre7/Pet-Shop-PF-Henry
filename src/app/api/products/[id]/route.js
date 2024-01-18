import { NextResponse } from "next/server";
import { conn, connectDB } from "@/libs/mongodb";
import Products from "@/models/products";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import Users from "@/models/users";
// obtener producto por id.

export async function GET(request, { params }) {
  try {
    const id = params.id;

    if (!conn.isConnected) connectDB();

    const result = await Products.findOne({ _id: id})
      .populate("category", {
        _id: 1,
        name: 1,
      })
      .populate("species", {
        _id: 1,
        name: 1,
      })
      .populate("brand", {
        _id: 1,
        name: 1,
      });

    if (!result) throw new TypeError("Product not found");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(error.message, { status: 404 });
  }
}

export async function PUT(request,{params}){
  try {
      const id = params.id
      const data = await request.json()

      let newProduct = {
        ...data
      }
      if(data?.species) newProduct = {...newProduct, species: [{_id: new Types.ObjectId(data.species)}]}

      if(data?.category) newProduct = {...newProduct, category: [{_id: new Types.ObjectId(data.category)}]}
      if(data?.brand) newProduct= {...newProduct, brand:{_id: new Types.ObjectId(data.brand)}}
      const findUpdate = await Products.findOneAndUpdate({_id: new Types.ObjectId(id)},{...newProduct});

      if(!findUpdate) throw TypeError('Product not found');

      const findProduct =  await Products.findOne({_id:findUpdate._id})
      .populate("category",{
         _id:0,
         name:1
     })
     .populate("species",{
         _id:0,
         name:1,
         age:1,
         size:1,
     })
     .populate("brand",{
         _id:0,
         name:1
     });
      return NextResponse.json({state:true,
      productUpdate:findProduct
      },{status:200});

    } catch (error) {
      return NextResponse.json(error.message,{status:400})
    }

}

export async function DELETE(request,{params}){
    try {
      if(!conn.isConnected) await connectDB();
      const session = await getServerSession();
      if(!session) throw TypeError('Unauthorized access');
       const findUser = await Users.findOne({email:session.user.email});
      if(findUser.role !== 2) throw TypeError('Unauthorized access');
      
        const id = new Types.ObjectId(params.id);
        const result = await Products.findByIdAndDelete(id);
        if(result) return NextResponse.json(result,{status:200})
    } catch (error) {
        return NextResponse.json(error.message,{status:400})
    }
} 