const mongoo = require ("../configuration/dbconfig")

const EmployerSchema = new mongoo.Schema(
  {
    _id: { type: mongoo.Schema.Types.ObjectId, ref: 'Utilisateur' },
    telephone: { type: String, required: true },
    adresse: {type: String, required: true},
    matriculate: { type: String, unique: true }, 
    state:{ type: String, enum:["accepted","rejected","pending"],default:"pending"},
  },
  {
    timestamps: true,
    versionKey: false
  } 
);

module.exports = mongoo.model('Employer', EmployerSchema);


