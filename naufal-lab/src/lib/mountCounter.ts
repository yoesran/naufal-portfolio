import { mount, unmount } from "svelte";
import Counter from "./Counter.svelte";

export default function mountCounter(target: HTMLElement) {
  const instance = mount(Counter, { target });
  return () => unmount(instance);
}
