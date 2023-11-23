"use client";

import About from "./about";
import { NavState, useNavContext } from "./nav-provider";
import Projects from "./projects";

export default function PageMainBlockHolder() {
  const { navState } = useNavContext();

  return navState === NavState.about ? (
    <About />
  ) : navState === NavState.projects ? (
    <Projects />
  ) : navState === NavState.resume ? null : null;
}
