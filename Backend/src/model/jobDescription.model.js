const mongoose = require('mongoose');

const JDSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true
    }
}, {
    timestamps:true
})


const JDModel = mongoose.model('JobDescription', JDSchema);

module.exports = JDModel;