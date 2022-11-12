const express = require('express')
const router = express.Router()
const upload = require('./../handler/multer')//form data
const jwt = require('jsonwebtoken')


const Branch = require('../models/Branches')
 
const Constants= require('./../constants/constant')

router.post('/add',upload,function(req,res){
    
    if(req.headers.authorization){ 
        const token = req.headers.authorization.split(" ")[1];
		var decoded;
		try {
			console.log(`token = ${token}`)
			decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
		} catch (ex) {
			console.log(ex.message)
			res.status(400)
			res.json({
				status: 'FAILED',
				message: 'Invalid token'
			})
			return
		}
		console.log("role:"+decoded.role);
		if(decoded.role=='admin'){
            console.log(req.body);
            const branch=req.body.branch;
            Branch.find({branch},function(err,result){
                if(err){
                    console.log("Error in finding branch")
                    res.status(500)
                    res.json({
                        status: "FAILED",
                        message: "Insernal server error"
                    })
                }
                if(result.length>=1)
                {
                    console.log("Already existing")
                    res.json({
                        message:"Already Existing Branch",
                        status:"FAILED"
                    });
                }
                else{
					/* what to do when we add more quotas? */
					var total = req.body.totalSeats
					var nri = req.body.NRISeats
					var mgmt = req.body.MgmtSeats
					nri = nri ? nri : 0
					mgmt = mgmt ? mgmt : 0
					if ((nri + mgmt) != total) {
						console.log(`${nri} + ${mgmt} != ${total}`)
						res.status(400)
						return res.json({
							status: "FAILED",
							message: "nri + mgmt != total"
						})
					}
                    const new_branch= new Branch({
                        branch:branch,
                        totalSeats:req.body.totalSeats,
                        NRISeats:req.body.NRISeats,
                        MgmtSeats:req.body.MgmtSeats,
						WLNRILimit: req.body.WLNRILimit,
						WLMgmtLimit: req.body.WLMgmtLimit
                    })
                    new_branch.save(function(err){
                        if(err){
                            console.log("Error in saving branch")
                            res.status(500)
                            res.json({
                                status: "FAILED",
                                message: err.message
                            })

                        }
                        else{
                            res.status(200)
                            res.json({
                                message:"Branch added successfully",
                                status:"SUCCESS"
                            })
                        }
                    })
                }
            })
        }
        else{
            res.status(403);
			res.json({
				status:"FAILED",
				message:'Access denied'
			})
        }
    }
    else{
		res.json({
			status:"FAILED",
			message:'Access token error'
		})
	}

});

/*
 * /branch/getall - list all fields of current branches
 * Only admin
 */
router.get('/getall', upload, function (req, res) {
	console.log(req.headers)
	if (typeof(req.headers.authorization) == 'undefined') {
		console.log('no token received')
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Token not specified'
		})
	}
	const token = req.headers.authorization.split(" ")[1];
	try {
		console.log(`token = ${token}`)
		decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
	} catch (ex) {
		console.log(ex.message)
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Invalid token'
		})
	}
	console.log(`role = ${decoded.role}`)
	if (decoded.role != 'admin') {
		console.log('not admin')
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Access denied'
		})
	}
	Branch.find(req.body, (err, result) => {
		if (err) {
			console.log(`error: ${err.message}`)
			res.status(500)
			return res.json({
				status: 'FAILED',
				message: err.message
			})
		}
		res.status(200)
		res.json({
			status: 'SUCCESS',
			list: result
		})
	})
})

/*
 * /branch/get - list all fields of current branches
 */
router.get('/get', upload, function (req, res) {
	console.log(req.headers)
	if (typeof(req.headers.authorization) == 'undefined') {
		console.log('no token received')
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Token not specified'
		})
	}
	const token = req.headers.authorization.split(" ")[1];
	try {
		console.log(`token = ${token}`)
		decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
	} catch (ex) {
		console.log(ex.message)
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Invalid token'
		})
	}

	Branch.find(req.body, (err, result) => {
		if (err) {
			console.log(`error: ${err.message}`)
			res.status(500)
			return res.json({
				status: 'FAILED',
				message: err.message
			})
		}
		res.status(200)
		res.json({
			status: 'SUCCESS',
			list: result.map(o => ({
				name: o.branch,
				totalSeats: o.totalSeats,
				NRISeats: o.NRISeats,
				MgmtSeats: o.MgmtSeats,
				NRIOccupied: o.occupiedSeatsNRI,
				MgmtOccupied: o.occupiedSeatsMgmt,
				MgmtWL: o.waitingListMgmt.length
				// TODO: Add waiting limit field
			}))
		})
	})
})
/*
 * /branch/delete - delete a branch from branch database
 * 	Branch to be deleted is given in request body which is passed directly to the
 * 	Branch.delete method
 */
router.delete('/delete', upload, function (req, res) {
	console.log(`headers\n${req.headers}`)
	if (typeof(req.headers.authorization) == 'undefined') {
		console.log('no token received')
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Token not specified'
		})
	}

	const token = req.headers.authorization.split(" ")[1];
	try {
		console.log(`token = ${token}`)
		decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
	} catch (ex) {
		console.log(ex.message)
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Invalid token'
		})
	}
	console.log("role:"+decoded.role);

	if (decoded.role != 'admin') {
		console.log('not admin')
		res.status(403)
		return res.json({
			status: 'FAILED',
			message: 'Access denied'
		})
	}

	console.log(req.body)
	if (Object.keys(req.body).length == 0) {
		console.log('empty body')
		res.status(400)
		return res.json({
			status: 'FAILED',
			message: 'Empty request body'
		})
	}

	Branch.deleteOne(req.body, (err, result) => {
		if (err) {
			console.log(`error deleting branch: ${err.message}`)
			res.status(500)
			return res.json({
				status: 'FAILED',
				message: err.message
			})
		}
		console.log('branch deleted successfully')
		res.status(200)
		return res.json({
			status: 'SUCCESS',
			message: 'Branch deleted successfully'
		})
	})
})

router.patch('/edit/:branch',upload, async function(req,res){
    if(req.headers.authorization){
		const token = req.headers.authorization.split(" ")[1];
		var decoded
		try {
			console.log(`token = ${token}`)
			decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
		} catch (ex) {
			console.log(ex.message)
			res.status(400)
			res.json({
				status: 'FAILED',
				message: 'Invalid token'
			})
			return
		}
		console.log("role:"+decoded.role);
		if(decoded.role=='admin'){
			_branch=req.params.branch;
			console.log(req.params)
			////
			console.log(`updating ${_branch}`)
			console.log(req.body)
			await Branch.updateOne({branch: _branch},{ $set: req.body}, { runValidators: true },function(err){
				if(err){
					res.status(500);	// Internal server error
					console.log('error message:\n' + err.message);
					return res.json({
						status: "FAILED",
						message: "Internal server error"
					});
				}
				res.json({
					status:"SUCCESS",
					message:"fields "+_branch+" quota is updated",
				}) 
				console.log('success')
			})
		} else {
			res.status(403);
			res.json({
				status:"FAILED",
				message:'Access denied'
			})
		}
		console.log('hellooo')
		
	}
	else{
		res.json({
			status:"FAILED",
			message:'Access token error'
		})
	}
})


router.get('/names',function(req,res){
    branchList=[]
    Branch.find({},{branch:1},function(err,b){
     
        b.forEach(function(item){
            branchList.push(item.branch)

        })
        res.status(200)
        res.json({
            status:"SUCCESS",
            message:branchList
        })
    })
})

module.exports = router
