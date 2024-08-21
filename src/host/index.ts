export abstract class Host {
  baseUrl: string;
  path: string;
  fullUrl: string;
  password: string;

  constructor({
    baseUrl,
    password,
    path
  }: {
    baseUrl: string;
    password: string;
    path?: string;
  }) {
    path ??= '/admin';
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }

    const pathExtractor = RegExp('^(http[s]?:+//[^/s]+)([/]?[^?#]+)?');
    const includedPath = pathExtractor.exec(baseUrl);

    if (includedPath && includedPath[1] && includedPath[2]) {
      baseUrl = includedPath[1];
      path = (this.trimTrailingSlash(includedPath[2]) ?? '') + path;
    }

    this.baseUrl = baseUrl;
    this.password = password;
    this.path = this.trimTrailingSlash(path);
    this.fullUrl = this.baseUrl + this.path;
  }

  private trimTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, url.length - 1) : url;
  }

  public getId(): string {
    return this.baseUrl;
  }
}
