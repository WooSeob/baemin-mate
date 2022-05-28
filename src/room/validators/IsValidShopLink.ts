import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

export function IsValidShopLink(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsValidShopLinkConstraint,
    });
  };
}

@ValidatorConstraint()
class IsValidShopLinkConstraint implements ValidatorConstraintInterface {
  validate(value: string, validationArguments?: ValidationArguments): boolean {
    // 요기요, 쿠팡이츠, 배민, 배달특급
    const thirdPartyAppPrefixes = [
      "https://yogiyo.onelink.me/",
      "https://web.coupangeats.com/",
      "https://baemin.me/",
      "https://app.specialdelivery.co.kr/",
    ];

    // 위 도메인 중 정확히 하나로 시작되어야 함
    return (
      thirdPartyAppPrefixes.filter((prefix) => value.indexOf(prefix) == 0)
        .length == 1
    );
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "올바르지 않은 외부 배달앱 링크입니다. 현재 요기요, 쿠팡이츠, 배민, 배달특급을 지원합니다.";
  }
}
