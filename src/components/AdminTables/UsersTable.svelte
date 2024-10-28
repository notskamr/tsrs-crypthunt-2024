<script lang="ts">
  import { DataHandler, Datatable, Th, ThFilter } from "@vincjo/datatables";

  export let data: any[] = [];

  let tableElement: HTMLElement | undefined;

  const handler = new DataHandler(data, { rowsPerPage: 25 });
  const rows = handler.getRows();

  $: data, update();

  const update = () => {
    if (tableElement) {
      const scrollTop = (tableElement.parentNode as HTMLElement).scrollTop;
      handler.setRows(data);
      setTimeout(() => {
        (tableElement!.parentNode as HTMLElement).scrollTop = scrollTop;
      }, 2);
    }
  };
  function formatDateTime(date: Date) {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  // console.log(data[0]);
</script>

<Datatable {handler}>
  <table class="w-full" bind:this={tableElement}>
    <thead>
      <tr>
        <Th {handler} align="center" orderBy="username">Username</Th>
        <Th {handler} align="center" orderBy="role">Role</Th>
        <Th
          {handler}
          align="center"
          orderBy={(row) => row?.team?.name || "null"}>Team</Th
        >
        <Th
          {handler}
          align="center"
          orderBy={(row) => formatDateTime(new Date(row.createdAt))}
          >Created At</Th
        >
      </tr>
      <tr>
        <ThFilter align="center" {handler} filterBy="username" />
        <ThFilter align="center" {handler} filterBy="role" />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) => row?.team?.name || "null"}
        />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) => formatDateTime(new Date(row.createdAt))}
        />
      </tr>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr
          id={row.id}
          class="cursor-pointer"
          on:click={() => {
            window.location.href = `/admin/users/${row.id}`;
          }}
        >
          <td id="user" data-content={row.username || "null"}
            >{row.username || "null"}</td
          >
          <td data-content={row?.role || "null"} class="capitalize" id="role"
            >{row.role || "null"}</td
          >
          <td data-content={row?.team?.name || "null"} id="team"
            >{row?.team?.name || "null"}</td
          >
          <td data-content={new Date(row.createdAt)}
            >{formatDateTime(new Date(row.createdAt))}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</Datatable>

<style>
  /* thead {
    background: #fff;
  } */

  tbody tr {
    transition: all, 0.2s;
  }
  tbody tr:hover {
    background: #f0f0f0;
  }
  @media (prefers-color-scheme: dark) {
    tbody tr:hover {
      background: #333;
    }
  }

  td {
    padding: 0.5rem;
    text-align: center;
  }

  #team:not([data-content="null"]) {
    text-transform: capitalize;
  }

  td[data-content="null"]:before {
    content: "null";
    color: #656565;
    font-style: italic;
  }

  td[data-content="null"] {
    color: #0000;
    user-select: none;
  }
</style>
