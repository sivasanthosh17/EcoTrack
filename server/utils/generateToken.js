import jwt from 'jsonwebtoken';

/**
 * Generate JSON Web Token (JWT) signed with user ID and role
 * @param {string} id - Mongoose User ID
 * @param {string} role - User role
 * @returns {string} JWT Token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export default generateToken;
