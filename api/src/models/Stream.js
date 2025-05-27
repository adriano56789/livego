const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  stream_key: {
    type: String,
    required: true,
    unique: true
  },
  srs_stream_id: {
    type: String,
    index: true
  },
  is_live: {
    type: Boolean,
    default: false,
    index: true
  },
  viewer_count: {
    type: Number,
    default: 0
  },
  thumbnail_url: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Geral'
  },
  tags: [{
    type: String,
    trim: true
  }],
  started_at: {
    type: Date
  },
  ended_at: {
    type: Date
  },
  duration: {
    type: Number, // em segundos
    default: 0
  },
  is_banned: {
    type: Boolean,
    default: false
  },
  ban_reason: {
    type: String,
    default: ''
  },
  chat_enabled: {
    type: Boolean,
    default: true
  },
  is_mature: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'pt-BR'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para consultas frequentes
streamSchema.index({ user: 1, is_live: -1 });
streamSchema.index({ is_live: -1, viewer_count: -1 });
streamSchema.index({ category: 1, is_live: -1 });

// Middleware para calcular a duração antes de salvar
streamSchema.pre('save', function(next) {
  if (this.ended_at && this.started_at) {
    this.duration = Math.floor((this.ended_at - this.started_at) / 1000); // Converter para segundos
  }
  next();
});

// Método estático para buscar streams ativos
streamSchema.statics.findActiveStreams = function(options = {}) {
  const { page = 1, limit = 10, category, search, userId } = options;
  
  const query = { is_live: true };
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'user.username': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (userId) {
    query.user = userId;
  }
  
  return this.find(query)
    .populate('user', 'username avatar')
    .sort({ viewer_count: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Método para incrementar contador de visualizações
streamSchema.methods.incrementViewerCount = async function() {
  this.viewer_count += 1;
  await this.save();
  return this.viewer_count;
};

// Método para decrementar contador de visualizações
streamSchema.methods.decrementViewerCount = async function() {
  this.viewer_count = Math.max(0, this.viewer_count - 1);
  await this.save();
  return this.viewer_count;
};

const Stream = mongoose.model('Stream', streamSchema);

module.exports = Stream;
