const stageOneVp = require('./stage_one_vp.model');
const UserModel = require('../user/user_model');
const responseHandler = require("../../util/response_handler");
const { APIError } = require("../../util/error_handler");
const { nanoid } = require('nanoid')
const mailHelper = require('../../util/mail')


exports.getProfile = async (req, res, next) => {
  try {

    const { userId } = req.user
    const { Id } = req.params
    const vp = await stageOneVp.findOne({ user: Id}).populate('user');
    if (!vp){
      throw new APIError(404, 'User does not have a verification profile for step one')
    }

    return responseHandler(res, 200, 'Profile', { profile: vp })
  } catch(err){
    return next(err)
  }
}


exports.updateProfile = async (req, res, next) => {
  try {
    
    const { userId } = req.user
    const { Id } = req.params
    if (Id != userId){
      throw new APIError(403, 'Not allowed')
    }
    const update = req.body
    const vp = await stageOneVp.findOneAndUpdate({ user: userId}, update, {
      new: true
    } );
    if (!vp){
      throw new APIError(404, 'User does not have a verification profile for step one')
    }
    return responseHandler(res, 200, 'Updated Profile', { profile: vp })
  } catch(err){
    return next(err)
  }
}

exports.getAllProfiles = async (req, res, next) => {
  try {

    let { status } = req.query
    status = ['incomplete', 'inreview', 'declined', 'complete'].includes(status) ? status : null
    const query = status ? { status } : {}
    const profiles = await stageOneVp.find(query).populate('user')
    return responseHandler(res, 200, 'All profiles', { profiles })
  } catch(err){
    return next(err)
  }
}

exports.submitProfile = async( req, res, next ) => {
  try {
    const { userId } = req.user
    const { Id } = req.params
    if (Id != userId){
      throw new APIError(403, 'Not allowed')
    }
    const update = req.body
    update.status = 'in review'
    const vp = await stageOneVp.findOneAndUpdate({ user: userId}, update );
    if (!vp){
      throw new APIError(404, 'User does not have a verification profile for step one')
    }
    return responseHandler(res, 200, 'Verification profile submitted')
  } catch(err){
    return next(err)
  }
}

exports.acceptProfile = async (req, res, next) => {
  try {
    const { Id: userId } = req.params
    const profile = await stageOneVp.findOne({ user: userId})
    if (!profile){
      throw new APIError(404, 'User does not have a verification profile for step one')
    }
    const hcid = 'HC-' + nanoid(5)
    console.log('hcid', hcid)
    await profile.update({ status: 'complete'})
    
    const user = await UserModel.findOneAndUpdate({ _id: userId }, { health_center_id: hcid }, {
      new: true
    })
    const msg = {
      from: 'omilosamuel@gmail.com',
      to: user.email,
      subject: 'MedEase: Documents Verified',
      html: '<div> Your documents have been verified! Head back to medEase for more info <div>'
    }
    const responses = await mailHelper.send(msg)
    console.log('result', user);
    console.log('res', responses);
    return responseHandler(res, 200, 'Accepted verification profile', { user })
  } catch(err){
    return next(err)
  }
}


exports.declineProfile = async (req, res, next) => {
  try {
    const { Id: userId } = req.params
    const { comments } = req.body
    const profile = await stageOneVp.findOne({ user: userId})
    if (!profile){
      throw new APIError(404, 'User does not have a verification profile for step one')
    }
    await profile.update({ status: 'declined', comments: comments });
    const user = await UserModel.findOne({ _id: userId })
    const msg = {
      from: 'omilosamuel@gmail.com',
      to: user.email,
      subject: 'MedEase: Documents Declined',
      html: '<div> Your documents have been declined! Head back to medEase for more info <div>'
    }
    const responses = await mailHelper.send(msg)
    return responseHandler(res, 200, 'Declined verification profile', { profile })
  } catch(err){
    return next(err)
  }
}
exports.getStats = async ( req, res, next) => {
  try {
    const stats = await stageOneVp.aggregate().group({ _id: '$status', number_of_students: { $sum: 1 }});
    return res.send({
      stats
    })
  } catch(err){
    return next(err)
  }
}