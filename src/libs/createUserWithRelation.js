import Users from "@/models/users";
import Citys from "@/models/city";
import Provinces from "@/models/provinces";
import Favorite from "@/models/favorite"
import { findOrCreateModel } from "./dbmethods";
import { connectDB } from "@/libs/mongodb";


export  async function addUser(user) {
  console.log('entro em addUser',user)
  try {
    const { city, province } = user;
    connectDB();
    
    if(!city || !province)  throw TypeError('City or Province is not defined'); 

      const newCity =  await findOrCreateModel(Citys,{name:city})
      const newProvince = await findOrCreateModel(Provinces,{name:province}) 
   
     let role = 1;     
    const adminEmail = 'petshop.kimey@gmail.com';
    if (user.email === adminEmail) {
      role = 2;
    }
      const savedUser = await Users.create({
        
        ...user,
        city: newCity._id,
        province: newProvince._id,
        role: role,
        active: true,
      });
      console.log('saveduser', savedUser)
      const newFavorite = await Favorite.create({userID:savedUser._id,products:[]});
      
      return savedUser
      
    
  

} catch (error) { 
  console.log(error)
  throw error 
}
    
}
