import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Enable CORS for frontend apps
    // Enable CORS for frontend apps
    app.enableCors({
        origin: [
            'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
            'https://main.d1e6f4hyfgvfmr.amplifyapp.com', // Admin Frontend
            'https://main.d2v9bjigz3yl74.amplifyapp.com', // POS Frontend
            'https://oragon-kaha.shop',
            'https://app.oragon-kaha.shop',
            'https://api.oragon-kaha.shop', // Self
            /\.amplifyapp\.com$/ // Allow all amplify preview apps
        ],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Server running on port ${port} in ${process.env.DEPLOY_MODE || 'CLOUD'} mode`);
}
bootstrap();
