const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], default: 'user' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ConversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  title: { type: String },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
