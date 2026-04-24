const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { createUser, getUserByEmail } = require('../db/queries/userQueries')

const register = async (req , res) => {
    const { username , email , password } = req.body
    
    if(!username || username.trim().length ===0){
        return res.status(400).json({ error: 'Username is required and cannot be empty' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ ;
    if(!passwordRegex.test(password)){
        return res.status(400).json({ error: 'Password must be at least 8 chars long and include uppercase, lowercase, number and special char' });
    }

    try{
        const checkemail = await getUserByEmail(email)
        if(checkemail){
            return res.status(400).json({ message : 'Email already exists'})
        }
        
        const password_hash = await bcrypt.hash(password , 10)

        const newUser = await createUser(username , email , password_hash)

        res.status(201).json({ message: 'User created successfully', user: newUser })

    }  catch(err){
        console.error(err)
        res.status(500).json({ error: 'Internal server error'})
    }
}


const login = async (req , res) => {
    const { email , password } = req.body;
    
    if(!email || !password){
        return res.status(401).json({error : 'Please fill in all fields'})
    }

    try{
        const user = await getUserByEmail(email)

        if(!user){
             return res.status(401).json({ error : 'Invalid credentials'})
        }

        const isMatch = await bcrypt.compare(password , user.password_hash)

        if(!isMatch){
            return res.status(401).json({ error : 'Invalid credentials'})
        }
        
        const token = jwt.sign(
            {id : user.id} ,
            process.env.JWT_SECRET,
            { expiresIn: '10d' }
        )

        res.status(200).json({
            message : "User Logged in successfully" ,
            token : token ,
            user : {
                id : user.id ,
                username : user.username ,
                email : user.email
            }
        })
        
    } catch(err){
        console.error(err)
        res.status(500).json({ error: 'Internal server error'})
    }
}

module.exports = {register , login}