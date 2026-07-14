export interface RequestWithFile extends Request {
    file?: Express.Multer.File;
  }