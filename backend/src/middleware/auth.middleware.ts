// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

export async function requireAuth(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const token = req.cookies?.auth_token;

		if (!token) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		const [rows] = await pool.query(
			`
        SELECT s.user_id
        FROM sessions s
        WHERE s.token = ?
          AND (s.expires_at IS NULL OR s.expires_at > NOW())
          AND s.revoked_at IS NULL
        LIMIT 1
      `,
			[token]
		);

		const sessions = rows as { user_id: number }[];
		const session = sessions[0];

		if (!session) {
			return res.status(401).json({ message: 'Invalid or expired session' });
		}

		// attach user to req
		(req as any).userId = session.user_id;
		next();
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}
