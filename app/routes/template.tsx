import { DataFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string(),
  serialized_source_guild: z.object({
    roles: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        color: z.number(),
      })
    ),
    channels: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        parent_id: z.nullable(z.number()),
        position: z.number(),
      })
    ),
  }),
});

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const templateId = new URL(request.url).searchParams.get("templateId");

  if (!templateId) {
    throw new Response("", { status: 400 });
  }

  const res = await fetch(
    `https://discord.com/api/v9/guilds/templates/${templateId}`
  );

  if (!res.ok) {
    throw new Response("", {
      status: res.status,
    });
  }

  const template = templateSchema.parse(await res.json());

  return {
    templateName: template.name,
    roles: template.serialized_source_guild.roles,
    channels: buildChannelTree(template.serialized_source_guild.channels),
  };
};

export default function Template() {
  const { templateName, channels, roles } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>{templateName}</h1>
      <h2>Roles</h2>
      <ul>
        {roles.map((role) => (
          <li style={{ color: `#${role.color}` }} key={role.id}>
            {role.name}
          </li>
        ))}
      </ul>

      <h2>Channels</h2>
      <ChannelList channels={channels} />
    </>
  );
}

interface Channel {
  id: number;
  name: string;
  children: Channel[];
  parent_id: number | null;
}

function ChannelList({ channels }: { channels: Channel[] }) {
  return (
    <ul>
      {channels.map((channel) => (
        <li key={channel.id}>
          {channel.children.length === 0 ? (
            channel.name
          ) : (
            <details>
              <summary>{channel.name}</summary>
              <ChannelList channels={channel.children} />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

type DiscordChannel = z.TypeOf<
  typeof templateSchema
>["serialized_source_guild"]["channels"][number];

function buildChannelTree(channels: DiscordChannel[]): Channel[] {
  const channelMap = new Map<number, Channel>();

  for (const channel of channels) {
    channelMap.set(channel.id, {
      id: channel.id,
      name: channel.name,
      children: [],
      parent_id: channel.parent_id,
    });
  }

  for (const channel of channels) {
    const parent = channelMap.get(channel.parent_id!);

    if (parent) {
      parent.children.push(channelMap.get(channel.id)!);
    }
  }

  return [...channelMap.values()].filter(
    (channel) => channel.parent_id === null
  );
}
