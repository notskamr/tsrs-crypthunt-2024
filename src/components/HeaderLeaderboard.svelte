<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { HOUSE_COLOR_MAPPINGS } from "@/utils/config";
  interface BarDisplay {
    color: string;
    progress: number;
  }

  export let first: BarDisplay;
  export let second: BarDisplay;
  export let third: BarDisplay;

  let show = false;

  interface Updated {
    name: string;
    progress: number;
  }

  onMount(() => {
    show = true;
    window?.addEventListener("crypthunt:team-leveled-up", (async (
      e: CustomEvent
    ) => {
      console.log("crypthunt:question-leveled-up", e.detail);
      const updated = (await fetch("/api/leaderboard?comparative=true").then(
        (res) => res.json()
      )) as Updated[];
      console.log("Got updated leaderboard icon progress");
      const mappedBarDisplays: BarDisplay[] = updated.map((u) => ({
        color:
          HOUSE_COLOR_MAPPINGS.find((h) => h.name === u.name)?.color(1) ||
          "black",
        progress: u.progress,
      }));
      first = mappedBarDisplays[0];
      second = mappedBarDisplays[1];
      third = mappedBarDisplays[2];
      if (second.progress === null && third.progress === null) {
        second.progress = 0.2;
        third.progress = 0.2;
        second.color = "black";
        third.color = "black";
      }
    }) as any);
  });

  const MAX_HEIGHT = 2.5; // 2rem
  // use MAX_HEIGHT to calculate the height of each bar based on the progress value
  // e.g. if progress is 0.5, the height should be 1rem

  // use the color property to set the background-color of the bar

  const bars = [first, second, third];
  bars.forEach((bar) => {
    bar.progress = Math.min(1, Math.max(0.2, bar.progress));
  });
</script>

{#if show}
  <a
    href="/leaderboard"
    aria-label="Leaderboard"
    title="Leaderboard"
    id="leaderboard-nav"
    class="grid grid-cols-3 w-9 items-end hover:saturate-150 hover:scale-105 duration-150 relative xs:static right-4 xs drop-shadow-[2px_2px_0px_#0004]"
  >
    <div
      transition:fly={{ y: 10, duration: 150, delay: 150 }}
      id="second"
      class="w-full rounded-tl-md duration-150"
      style="background-color: {second.color}; height: {second.progress *
        MAX_HEIGHT}rem;"
    ></div>
    <div
      in:fly={{ y: 10, duration: 150, delay: 50 }}
      id="first"
      class="w-full rounded-tr-md duration-150"
      style="background-color: {first.color}; height: {first.progress *
        MAX_HEIGHT}rem;"
    ></div>
    <div
      in:fly={{ y: 10, duration: 150, delay: 250 }}
      id="third"
      class="w-full rounded-br-md duration-150"
      style="background-color: {third.color}; height: {third.progress *
        MAX_HEIGHT}rem;"
    ></div>
  </a>
{/if}
