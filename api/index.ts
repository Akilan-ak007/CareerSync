import app from '../backend/src/index';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless Handler Error:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal Server Error',
    });
  }
}
