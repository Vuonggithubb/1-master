import db from '../models/index';
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);

let hashUserPassword = (password) => {
    return new Promise(async(resolve, reject) => {
        try {
            let hashUserPassword = await bcrypt.hashSync(password,salt);
            resolve(hashUserPassword);
            
        } catch (e) {
            reject(e);
            
        }
    })
}



let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                //user already exist
                let user = await db.User.findOne({
                    attributes: ['email', 'roleId', 'password'],
                    where: { email: email },
                    raw: true,

                });
                if (user) {
                    //compare password: dùng cách 1 hay cách 2 đều chạy đúng cả =))
                    // Cách 1: dùng asynchronous (bất đồng bộ)
                    let check = await bcrypt.compare(password, user.password);


                    // Cách 2: dùng synchronous  (đồng bộ)
                    // let check = bcrypt.compareSync(password, user.password);

                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = 'OK';

                        delete user.password;
                        userData.user = user;
                    }
                    else {
                        userData.errCode = 3;
                        userData.errMessage = 'Wrong password';
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User not found`;
                }

            } else {
                //return error
                userData.errCode = 1;
                userData.errMessage = `Your's Email isn't exist in our system, plz try other email`
            }
            resolve(userData)
        } catch (e) {
            reject(e);
        }
    })
}

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if (user) {
                resolve(true)
            } else {
                resolve(false)
            }

        } catch (e) {
            reject(e)
        }
    })
}

let getAllUsers = (userId) => {
    return new Promise( async (resolve, reject) => {
        try {
            let users = '';
            if(userId === 'All'){
                users =await db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId && userId !== 'All'){
                users =await db.User.findOne({
                    where: {id: userId},
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            resolve(users)
            
        } catch (e) {
            reject(e);
            
        }
    })
}

let createNewUser = (data) => {
    return new Promise( async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode:  1,
                    messge: "Your email is already in used, Plz try another email!"
                })
            }

            let hashPasswordFromBcrypt = await hashUserPassword(data.password);
            await db.User.create({
                email: data.email,
                password: hashPasswordFromBcrypt,
                firstName: data.firstName,
                lastName: data.lastName,
                address: data.address,
                phonenumber: data.phonenumber,
                gender: data.gender === '1'? true: false,
                roleId: data.roleId
            })

            resolve({
                errCode: 0,
                messge: 'Ok'
            })


        }catch(e){
            reject(e);
        }
    }) 
}

let deleteUser = (userId) => {
    return new Promise( async (resolve, reject) => {
        let foundUser = await db.User.findOne({
            where: {id: userId}
        })
        if (!foundUser) {
            resolve({
                errCode: 2,
                errMessage: 'the user isnt exist'
            })
        }

        await db.User.destroy({
            where: { id: userId}
        })

        resolve ({
            errCode: 0,
            messge: 'the user is deleted'
        })
    })
}

let updateUserData = (data) => {
    return new Promise( async (resolve, reject) => {
        try {
            if (!data.id){
                resolve({
                    errCode :2 ,
                    errMessage: 'Missing input'
                })
            }
            let user = await db.User.findOne({
                where: {id: data.id},
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
    
                await user.save();
    
                resolve({
                    errCode: 0,
                    messge: 'update the user succeeds'
    
                })
    
            }else{
                resolve({
                    errCode: 1,
                    errMessage: 'user is not fond!'
                });
            }
    
            
        } catch (e) {
            reject(e);
            
        }      
    })
}


module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUserData: updateUserData

}