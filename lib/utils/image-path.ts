'use client';

export function getPropertyImagePath(
  imagesDomain: string,
  imageName: string,
  propertyId: string
): string {
  if (!imagesDomain) {
    return imageName;
  }
  return `${imagesDomain}/images/properties/${propertyId}/${imageName}`;
}

export function getUserAvatarPath(imagesDomain: string, imageName: string, userId: string): string {
  if (!imagesDomain) {
    return imageName;
  }
  return `${imagesDomain}/images/users/${userId}/${imageName}`;
}
