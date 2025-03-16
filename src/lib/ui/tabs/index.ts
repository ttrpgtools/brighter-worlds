import { Tabs as TabsPrimitive } from 'bits-ui';
import Content from './tab-content.svelte';
import List from './tab-list.svelte';
import Trigger from './tab-trigger.svelte';

const Root = TabsPrimitive.Root;

export {
  Root,
  Content,
  List,
  Trigger,
  //
  Root as Tabs,
  Content as TabsContent,
  List as TabsList,
  Trigger as TabsTrigger
};
