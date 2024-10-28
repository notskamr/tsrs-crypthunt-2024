<script lang="ts">
  import type { OpenLeaderboardInfoDetails } from "@/utils/types";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  let closeButton: HTMLButtonElement;
  let modal: HTMLDivElement;
  let modalContent: HTMLDivElement;
  let show = false;

  let detailsDefault: OpenLeaderboardInfoDetails = {
    teamName: "N/A",
    levelUpTime: "N/A",
  };

  $: details = detailsDefault;
  function close() {
    show = false;
  }
  onMount(() => {
    window.addEventListener("crypthunt:open-leaderboard-info", ((
      e: CustomEvent
    ) => {
      show = true;
      details = e.detail as OpenLeaderboardInfoDetails;
    }) as EventListener);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close();
      }
    });
  });

  $: closeButton?.addEventListener("click", () => {
    close();
  });

  $: modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      close();
    }
  });
</script>

{#if show}
  <div
    id="modal"
    bind:this={modal}
    class="absolute w-full h-full top-0 left-0 flex items-center justify-center backdrop-blur-sm z-50 bg-black/5 overflow-hidden"
    transition:fly={{ y: 400, duration: 300 }}
  >
    <div
      id="modal-content"
      bind:this={modalContent}
      class="flex flex-col w-full px-8 max-w-xs h-fit bg-black text-neutral-100 p-4 rounded-tl-md rounded-br-md text-left pointer-events-auto relative bottom-8 select-none"
    >
      <h2 class="text-2xl font-semibold capitalize mb-1">{details.teamName}</h2>
      <p class="text-lg font-semibold">
        Level up time: <span class="font-light"
          >{details.levelUpTime
            ? new Date(details.levelUpTime).toLocaleString()
            : "N/A"}</span
        >
      </p>
      <button
        class="w-fit text-xl mt-4 hover:text-red-300"
        bind:this={closeButton}>Close</button
      >
    </div>
  </div>
{/if}
