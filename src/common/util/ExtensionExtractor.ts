export const ExtensionExtractor = {
  from: (filename: string) => {
    const tokens = filename.split(".");
    if (tokens.length == 1) {
      throw new Error("확장자가 없는 파일입니다.");
    }
    return tokens[tokens.length - 1];
  },
};
