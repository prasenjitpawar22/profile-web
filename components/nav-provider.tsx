"use client";
import { createContext, ReactNode, useMemo, useState, useContext } from "react";

export enum NavState {
  "about",
  "projects",
  resume,
}

export type TInitialState = {
  navState: NavState;
  setNavState: (state: NavState) => void;
};

const initialState: TInitialState = {
  navState: NavState.about,
  setNavState: (state: NavState) => null,
};

const NavContext = createContext<TInitialState>(initialState);

export default function NavContextProver({
  children,
}: {
  children: ReactNode;
}) {
  const [navState, setNavState] = useState(initialState.navState);

  const value = useMemo(
    () => ({ navState, setNavState }),
    [navState, setNavState]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export const useNavContext = () => {
  const context = useContext(NavContext);

  if (context === undefined) throw new Error("nav context error");

  return context;
};
