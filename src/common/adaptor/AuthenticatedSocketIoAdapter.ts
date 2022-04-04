import { INestApplicationContext, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
// import { extract, parse } from 'query-string';
// import {SocketIO} from "mock-socket";
import { ServerOptions } from "socket.io";
import { AuthService } from "../../auth/auth.service";

export class AuthenticatedSocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger("AuthenticatedSocketIoAdapter");
  private readonly authService: AuthService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.authService = this.app.get(AuthService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    options.allowRequest = async (request, allowFunction) => {
      this.logger.log(request);
      // const token = parse(extract(request.url))?.token as string;
      // const verified = token && (await this.jwtService.verify(token));
      // if (verified) {
      //     return allowFunction(null, true);
      // }
      //
      // return allowFunction('Unauthorized', false);
      return allowFunction(null, true);
    };

    return super.createIOServer(port, options);
  }
}
