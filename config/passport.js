const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')
const { User } = require('../models')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

passport.use(
  new LocalStrategy(
    {
      usernameField: 'account',
      passwordField: 'password'
    },
    async (account, password, done) => {
      try {
        const user = await User.findOne({ where: { account } })
        if (!user) throw new Error('帳號不存在！')
        const passwordMatching = await bcrypt.compare(password, user.password)
        if (!passwordMatching) throw new Error('帳號不存在！')
        return done(null, user)
      } catch (err) {
        return done(err, false)
      }
    }
  )
)

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(
  new JWTStrategy(jwtOptions, (jwtPayload, cb) => {
    User.findByPk(jwtPayload.id, {
      raw: true,
      nest: true,
      include: [
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
      .then((user) => {
        cb(null, user)
      })
      .catch((err) => {
        cb(err, false)
      })
  })
)

/*
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser(async (id, cb) => {
  const user = await User.findByPk(id).toJSON()
  return cb(null, user)
})
*/
module.exports = passport
