export const fetchUsers = async () => {
  const res = await fetch("http://117.218.59.207:5001/api/users/");
  return res.json();
};

// utils.ts
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}


export const addUser = async (name: string, email: string) => {
  const res = await fetch("http://117.218.59.207:5001/api/users/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
};

