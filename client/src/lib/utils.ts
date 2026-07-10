export const fetchUsers = async () => {
  const res = await fetch("http://127.0.0.1:5000/api/users/");
  return res.json();
};

// utils.ts
type ClassValue = string | undefined | false | null | Record<string, boolean | undefined | null>;

export function cn(...classes: ClassValue[]) {
  return classes
    .flatMap((c) => {
      if (typeof c === "object" && c !== null) {
        return Object.entries(c)
          .filter(([, v]) => v)
          .map(([k]) => k);
      }
      return c || undefined;
    })
    .filter(Boolean)
    .join(" ");
}


export const addUser = async (name: string, email: string) => {
  const res = await fetch("http://127.0.0.1:5000/api/users/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
};

