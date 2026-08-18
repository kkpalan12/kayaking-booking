interface GoogleLocalizedText {
  text?: string;
  languageCode?: string;
}

interface GoogleAuthorAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

interface GoogleReview {
  name?: string;
  relativePublishTimeDescription?: string;
  text?: GoogleLocalizedText;
  originalText?: GoogleLocalizedText;
  rating?: number;
  authorAttribution?: GoogleAuthorAttribution;
  publishTime?: string;
  flagContentUri?: string;
  googleMapsUri?: string;
}

interface GooglePlaceDetailsResponse {
  id?: string;
  displayName?: GoogleLocalizedText;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  googleMapsLinks?: {
    reviewsUri?: string;
  };
  reviews?: GoogleReview[];
}

export interface PublicGoogleReview {
  rating: number;
  text: string;
  authorName: string;
  authorUri: string | null;
  authorPhotoUri: string | null;
  relativeTime: string;
  publishTime: string | null;
  googleMapsUri: string | null;
}

export interface GoogleReviewsResponse {
  rating: number;
  reviewCount: number;
  reviews: PublicGoogleReview[];
  googleMapsUri: string | null;
  reviewsUri: string | null;
}

const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places";

export async function getGoogleReviews(): Promise<GoogleReviewsResponse> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  if (!placeId) {
    throw new Error("GOOGLE_PLACE_ID is not configured");
  }

  const response = await fetch(
    `${GOOGLE_PLACES_URL}/${encodeURIComponent(placeId)}?languageCode=en`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(`Google Places API error ${response.status}: ${errorBody}`);
  }

  const place = (await response.json()) as GooglePlaceDetailsResponse;

  /*
   * Google Places API (New) returns at most five reviews.
   *
   * We only display genuine reviews with a rating >= 4.
   * We never manufacture or substitute review content.
   */
  const reviews: PublicGoogleReview[] = (place.reviews ?? [])
    .filter(
      (review) =>
        typeof review.rating === "number" &&
        review.rating >= 4 &&
        !!review.text?.text &&
        !!review.authorAttribution?.displayName,
    )
    .map((review) => ({
      rating: review.rating as number,

      text: review.text?.text?.trim() ?? "",

      authorName:
        review.authorAttribution?.displayName?.trim() ?? "Google user",

      authorUri: review.authorAttribution?.uri ?? null,

      authorPhotoUri: review.authorAttribution?.photoUri ?? null,

      relativeTime: review.relativePublishTimeDescription ?? "",

      publishTime: review.publishTime ?? null,

      googleMapsUri: review.googleMapsUri ?? null,
    }));

  return {
    rating: place.rating ?? 0,

    reviewCount: place.userRatingCount ?? 0,

    reviews,

    googleMapsUri: place.googleMapsUri ?? null,

    reviewsUri:
      place.googleMapsLinks?.reviewsUri ?? place.googleMapsUri ?? null,
  };
}
