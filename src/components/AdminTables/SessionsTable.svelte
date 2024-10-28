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
</script>

<Datatable {handler}>
  <table class="w-full" bind:this={tableElement}>
    <thead>
      <tr>
        <Th {handler} align="center" orderBy="user">User</Th>
        <Th {handler} align="center" orderBy="role">Role</Th>
        <Th {handler} align="center" orderBy="team">Team</Th>
        <Th
          {handler}
          align="center"
          orderBy={(row) => formatDateTime(new Date(row.createdAt * 1000))}
          >Login Time</Th
        >
        <Th {handler} align="center" orderBy="ipAddress">IP Address</Th>
      </tr>
      <tr>
        <ThFilter align="center" {handler} filterBy="user" />
        <ThFilter align="center" {handler} filterBy={(row) => row.user.role} />
        <ThFilter align="center" {handler} filterBy={(row) => row.user.team} />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) => formatDateTime(new Date(row.createdAt * 1000))}
        />
        <ThFilter align="center" {handler} filterBy="ipAddress" />
      </tr>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr
          id={row.id}
          class="cursor-pointer"
          on:click={() => {
            window.location.href = `/admin/sessions/${row.id}`;
          }}
        >
          <td id="user" data-content={row?.user?.username || "null"}
            >{row?.user?.username || "null"}</td
          >
          <td data-content={row?.user?.role || "null"} id="role"
            >{row?.user?.role || "null"}</td
          >
          <td data-content={row?.user?.team?.name || "null"} id="team"
            >{row?.user?.team?.name || "null"}</td
          >
          <td data-content={new Date(row.createdAt * 1000)}
            >{formatDateTime(new Date(row.createdAt * 1000))}</td
          >
          <td data-content={row.ipAddress}>{row.ipAddress}</td>
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
