const request = require('supertest')
const app = require('../src/app')
const User= require('../src/models/user')
const mongoose = require('mongoose')
const jwt= require('jsonwebtoken')

const userOneId = new mongoose.Types.ObjectId()
const userOne= {
    _id:userOneId,
    name:"Test Name",
    email:"testemail@ok.com",
    password:"Red1235!",
    age:21,
    tokens:[{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET_KEY)
    }]
}

beforeEach(async ()=>{
    await User.deleteMany()
    await new User(userOne).save()
})

test('Should signup a new user', async ()=> {

    const res  = await request(app).post('/users').send({
        name:"Manoj More",
        email:"example@test.com",
        password:"Red@12345",
        age: 22
    }).expect(201)

    //Assert that the database was changed correctly.
    const user = await User.findById(res.body.user._id)
    expect(user).not.toBeNull()

    //Assertions about response
    expect(res.body).toMatchObject({
        user:{
            name:"Manoj More",
            email:"example@test.com"
        },
        token:user.tokens[0].token
    })
    expect(user.password).not.toBe('Red@12345')
})

test('Should login existing user', async()=>{
    const res = await request(app).post('/users/login').send({
        email:userOne.email,
        password:userOne.password
    }).expect(200)
    const user = await User.findById(userOneId)
    expect(res.body.token).toBe(user.tokens[1].token)
})

test('Should not login wrong user', async()=>{
    await request(app).post('/users/login').send({
        email:userOne.email,
        password: "thiis is password"
    }).expect(400)
})

test('Should get profile for a user', async()=>{
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})
test('Should get profile for a user', async()=>{
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async()=>{
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete an account for User', async()=>{
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})


test('Should not delete an account for unauthenticated User', async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should not delete an account for unauthenticated User', async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should update valid user fields', async()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name:"new name"
    })
    .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('new name')
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Maharashtra'
        })
        .expect(400)
})
