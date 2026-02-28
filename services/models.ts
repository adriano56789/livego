// services/models.ts

/**
 * =================================================================================
 * SIMULATION OF MONGODB SCHEMAS/MODELS
 * =================================================================================
 * This file defines the data structures (schemas) that would be used
 * to model the collections in a real MongoDB database.
 * In a Node.js backend, this would typically be done with the Mongoose library.
 * 
 * Each "Schema" below represents a "collection" in the database.
 */

// --- Schema for the 'users' Collection ---
const UserSchema = {
  _id: "ObjectId",
  identification: "String", // User-facing ID
  name: "String",
  avatarUrl: "String",
  coverUrl: "String",
  country: "String",
  age: "Number",
  gender: "String", // ('male', 'female', 'not_specified')
  level: "Number",
  diamonds: "Number",
  earnings: "Number",
  bio: "String",
  isVIP: "Boolean",
  vipExpirationDate: "ISODate",
  createdAt: "ISODate",
  lastLogin: "ISODate"
};

// --- Schema for the 'works' Collection (User Posts) ---
const WorkSchema = {
  _id: "ObjectId",
  authorId: { type: "ObjectId", ref: "User" },
  type: "String", // 'video' or 'image'
  url: "String",
  thumbnailUrl: "String",
  description: "String",
  likesCount: "Number",
  createdAt: "ISODate"
};

// --- Schema for the 'follows' Collection (Relationships) ---
const FollowSchema = {
  _id: "ObjectId",
  followerId: { type: "ObjectId", ref: "User" }, // User who is following
  followedId: { type: "ObjectId", ref: "User" }, // User being followed
  createdAt: "ISODate"
};

// --- Schema for the 'gifts' Collection (Gift Catalog) ---
const GiftSchema = {
  _id: "ObjectId",
  name: "String",
  price: "Number", // Price in diamonds
  icon: "String",
  category: "String", // ('Popular', 'Luxo', 'VIP', etc.)
  isActive: "Boolean"
};

// --- Schema for the 'transactions' Collection (Wallet History) ---
const TransactionSchema = {
    _id: "ObjectId",
    userId: { type: "ObjectId", ref: "User" },
    type: "String", // 'purchase_diamonds', 'withdraw_earnings', 'send_gift'
    amount: "Number", // Can be BRL for purchases/withdrawals or diamonds for gifts
    description: "String",
    status: "String", // 'completed', 'pending', 'failed'
    createdAt: "ISODate"
};

// --- Schema for the 'streams' Collection (Live Sessions) ---
const StreamSchema = {
    _id: "ObjectId",
    hostId: { type: "ObjectId", ref: "User" },
    title: "String",
    status: "String", // ('live', 'ended', 'scheduled')
    startTime: "ISODate",
    endTime: "ISODate",
    peakViewers: "Number",
    totalCoins: "Number",
    isPrivate: "Boolean"
};

// --- Schema for the 'messages' Collection (Private Chat) ---
const MessageSchema = {
    _id: "ObjectId",
    chatId: "String", // Combined ID of the two users
    from: { type: "ObjectId", ref: "User" },
    to: { type: "ObjectId", ref: "User" },
    text: "String",
    timestamp: "ISODate",
    status: "String" // ('sent', 'delivered', 'read')
};


// In a real app, you would export Mongoose models like this:
// export const User = mongoose.model('User', UserSchema);
// For now, we just export the schema definitions for clarity.
export const models = {
    User: UserSchema,
    Work: WorkSchema,
    Follow: FollowSchema,
    Gift: GiftSchema,
    Transaction: TransactionSchema,
    Stream: StreamSchema,
    Message: MessageSchema
};
