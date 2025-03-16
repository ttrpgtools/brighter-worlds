<script lang="ts" module>
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { type VariantProps, tv } from 'tailwind-variants';
  import type { ClassNameValue } from '$lib/util/tw';

  export const buttonVariants = tv({
    base: 'inline-flex gap-3 items-center rounded-full border border-transparent focus-visible:ring-primary text-lg justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:bg-gray-300 disabled:dark:bg-gray-700 [&_svg]:pointer-events-none',
    variants: {
      variant: {
        default:
          'bg-primary-300 dark:bg-primary-700 shadow-sm hover:bg-primary-200 dark:hover:bg-primary-800',
        destructive: 'bg-red-300 dark:bg-red-700 shadow-sm hover:bg-red-200 dark:hover:bg-red-800',
        outline:
          'border-primary-300 dark:border-primary-700 bg-transparent hover:bg-primary-100 dark:hover:bg-primary-900 border',
        ghost: 'hover:bg-primary-100 dark:hover:bg-primary-900',
        link: 'text-primary-500 underline-offset-4 hover:underline',
        status:
          'rounded border text-sm text-gray-700 dark:text-gray-300 shadow-sm focus:ring-purple-500 border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600'
      },
      size: {
        default: 'px-6 pt-2 pb-2.5',
        sm: 'px-2.5 py-1.5',
        lg: 'h-16 px-8',
        icon: 'h-10 w-10',
        tight: 'p-1'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

  export type ButtonProps = HTMLButtonAttributes &
    HTMLAnchorAttributes & {
      class?: ClassNameValue;
      variant?: ButtonVariant;
      size?: ButtonSize;
      icon?: string;
      iconClass?: ClassNameValue;
    };
</script>

<script lang="ts">
  import Icon from './icon.svelte';
  import { cn } from '$lib/util/tw';

  let {
    class: className,
    variant = 'default',
    size = 'default',
    href = undefined,
    type = 'button',
    icon,
    iconClass,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

{#if href}
  <a class={cn(buttonVariants({ variant, size, className }))} {href} {...restProps}>
    {#if icon}<Icon {icon} class={cn('size-5', iconClass)} />{/if}
    {@render children?.()}
  </a>
{:else}
  <button class={cn(buttonVariants({ variant, size, className }))} {type} {...restProps}>
    {#if icon}<Icon {icon} class={cn('size-5', iconClass)} />{/if}
    {@render children?.()}
  </button>
{/if}
