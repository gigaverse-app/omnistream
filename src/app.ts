import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import { TokenManager, StreamService, ChatService } from './services';
import { createOAuthRoutes, createStreamRoutes, createChatRoutes } from './routes';

export class OmniStreamApp {
  private app: Application;
  private tokenManager: TokenManager;
  private streamService: StreamService;
  private chatService: ChatService;
  
  constructor() {
    this.app = express();
    this.tokenManager = new TokenManager();
    this.streamService = new StreamService(this.tokenManager);
    this.chatService = new ChatService(this.tokenManager);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ success: true, data: { status: 'healthy' } });
    });
    
    // API routes
    this.app.use('/oauth', createOAuthRoutes(this.tokenManager));
    this.app.use('/streams', createStreamRoutes(this.streamService));
    this.app.use('/chat', createChatRoutes(this.chatService));
    
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route not found' }
      });
    });
  }
  
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error('[Error]', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: err.message }
      });
    });
  }
  
  public getApp(): Application {
    return this.app;
  }
  
  public start(): void {
    this.app.listen(config.port, () => {
      console.log(`OmniStream server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  }
}
