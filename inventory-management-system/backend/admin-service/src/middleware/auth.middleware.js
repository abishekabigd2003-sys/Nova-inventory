import jwt from 'jsonwebtoken';

/**
 * protect — requires a valid Bearer JWT token.
 * Attaches decoded payload { id, role } to req.user.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error(`[auth.middleware] Missing or invalid auth header on ${req.method} ${req.originalUrl}. Headers:`, JSON.stringify(req.headers));
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // { id, role, iat, exp }
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * admin — requires user role to be 'Admin'.
 * Must be used after protect middleware.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as an Admin' });
};

/**
 * authorize — requires user role to be one of the specified roles.
 * Must be used after protect middleware.
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access denied: requires role ${roles.join(' or ')}` });
    }
    return next();
  };
};
