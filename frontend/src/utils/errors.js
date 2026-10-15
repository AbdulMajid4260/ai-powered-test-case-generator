/** An error with a short title and a user-friendly message. */
export class AppError extends Error {
  constructor(title, message) {
    super(message);
    this.title = title;
  }
}

export function toDisplayError(err) {
  if (err instanceof AppError) return { title: err.title, message: err.message };
  console.error(err);
  return { title: "Unexpected error", message: "Something unexpected happened. Please try again." };
}
