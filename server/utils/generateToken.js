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
    process.env.JWT_SECRET || 'ecotrack_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

export default generateToken;
