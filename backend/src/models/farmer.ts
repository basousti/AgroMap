const mongose = require ("../configuration/dbconfig")

const farmerSchema = new mongose.Schema(
  {
    _id: { type: mongose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    localite: { type: String, required: true },
    telephone: { type: String, required: true },
    adresse: {type: String, required: true},
    state:{ type: String, enum:["actif","inactif"]},
  },
  {
    timestamps: true,
    versionKey: false
  }
);
module.exports =mongose.model('agriculteurs', farmerSchema);
