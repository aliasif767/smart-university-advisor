import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            // No minlength here — advisor-registered students use rollNo as their
            // default password, which can be shorter than 6 chars (e.g. "232").
            // Length validation belongs at the auth/register route level only.
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["hop", "teacher", "advisor", "student"],
            required: true,
        },

        // ── Student identity fields ──────────────────────────────────
        studentId: {
            type: String,
            required: function () {
                return this.role === "student";
            },
            sparse: true,
            trim: true,
        },
        rollNo: {
            // Same value as studentId; kept separately so query matching
            // in teacherRoutes / advisorRoutes always has a reliable string field.
            type: String,
            default: "",
            trim: true,
        },
        semester: {
            type: Number,
            default: null,
        },
        section: {
            type: String,
            default: "",
            trim: true,
        },
        batch: {
            type: String,
            default: '',
            sparse: true,
            trim: true,
        },

        // ── Relationship fields ──────────────────────────────────────
        // Set by advisor when registering a student
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Set by advisor via "Assign Teacher" action
        assignedTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ── Account status ───────────────────────────────────────────
        avatar: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        profileImage: {
            type: String,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

// ── Indexes ──────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ batch: 1 });
userSchema.index({ advisorId: 1 });        // fast lookup of advisor's students
userSchema.index({ assignedTeacher: 1 });  // fast lookup of teacher's students

// ── Hash password before saving ──────────────────────────────────────
// NOTE: advisorRoutes.js already hashes the password with bcrypt before
// calling `new User(...)`, so the pre-save hook sees an already-hashed value.
// The `isModified("password")` guard means it won't double-hash on updates,
// but for NEW student documents created by the advisor the password field
// is set directly (pre-hashed), so this hook is effectively skipped for them.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ── Instance methods ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};

const User = mongoose.model("User", userSchema);

export default User;