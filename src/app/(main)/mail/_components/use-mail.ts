import { create } from "zustand";

import { type Mail, mails } from "./data";

type Config = {
  selected: Mail["id"] | null;
};

type MailStore = {
  mail: Config;
  /** Messages moved to Trash in this session. */
  trashed: Mail["id"][];
  setMail: (mail: Config) => void;
  moveToTrash: (id: Mail["id"]) => void;
};

const useMailStore = create<MailStore>((set) => ({
  mail: {
    selected: mails[0].id,
  },
  trashed: [],
  setMail: (mail) => set({ mail }),
  moveToTrash: (id) =>
    set((state) => ({
      trashed: state.trashed.includes(id) ? state.trashed : [...state.trashed, id],
      mail: { selected: state.mail.selected === id ? null : state.mail.selected },
    })),
}));

export function useMail() {
  const mail = useMailStore((state) => state.mail);
  const setMail = useMailStore((state) => state.setMail);

  return [mail, setMail] as const;
}

/** Trash state, kept separate so the list can filter without re-reading `mail`. */
export function useTrashedMail() {
  const trashed = useMailStore((state) => state.trashed);
  const moveToTrash = useMailStore((state) => state.moveToTrash);

  return { trashed, moveToTrash };
}
