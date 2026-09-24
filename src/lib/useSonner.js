import { cn } from '@/utils/utils'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Custom Sonner Toast Hook
 * @example
 * const { customSonner } = useSonner();
 * customSonner({ type: 'success', text: 'Operation completed successfully!' });
 * customSonner({ type: 'error', text: 'An error occurred' });
 */
export function useSonner() {
  const customSonner = (options) => {
    let type = 'success'
    let text = ''
    let actionLabel
    let actionOnClick

    if (typeof options === 'string') {
      text = options
    } else if (options && typeof options === 'object') {
      type = options.type || 'success'
      text = options.text || ''
      actionLabel = options.actionLabel
      actionOnClick = options.actionOnClick
    }

    const toastConfigs = {
      success: {
        title: 'Success',
        text: text || 'Changes have been applied successfully.',
        button: <X className="size-3" />,
        icon: <Check color="#83E56A" size={18} />,
      },
      error: {
        title: 'Error',
        text: text || 'Failed to update the information. Please try again.',
        button: <X className="size-3" />,
        icon: <AlertTriangle color="#F93333" size={18} />,
      },
      info: {
        title: 'Info',
        text: text || 'Information update.',
        button: <X className="size-3" />,
        icon: <Info color="#388DE2" size={18} />,
      },
      continue: {
        title: 'Continue',
        text: text || 'Operation continued.',
        button: <X className="size-3" />,
        icon: <Info color="#9b16c7" size={18} />,
      },
    }

    const config = toastConfigs[type] || toastConfigs.info

    return toast.custom(
      (t) => {
        return (
          <div
            className={cn(
              'md:w-[23.125rem] w-full border rounded-lg p-3 relative dark:bg-[#09090B] bg-white shadow-lg',
              styles[type] || styles.info
            )}
          >
            <div className="flex items-center gap-2">
              {config.icon}
              <h2 className="font-medium text-base dark:text-[#FAFAFA] text-[#09090B]">
                {config.title}
              </h2>
            </div>
            <p className="text-sm dark:text-[#A1A1AA] text-[#71717A] pr-16 whitespace-pre-line mt-1">
              {config.text}
            </p>

            <div className="absolute inset-y-0 flex items-center right-3 gap-1.5">
              {actionLabel && actionOnClick && (
                <button
                  className="border dark:border-[#27272A] border-[#E4E4E7] rounded-md py-1 px-2.5 text-xs dark:text-[#fafafa] text-[#09090B] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  type="button"
                  onClick={() => {
                    toast.dismiss(t)
                    actionOnClick()
                  }}
                >
                  {actionLabel}
                </button>
              )}
              <button
                className="border dark:border-[#27272A] border-[#E4E4E7] rounded-md py-1 px-1.5 text-xs dark:text-[#fafafa] text-[#09090B] hover:bg-gray-100 transition-colors"
                type="button"
                onClick={() => toast.dismiss(t)}
              >
                {config.button}
              </button>
            </div>
          </div>
        )
      },
      {
        duration: 5000,
      }
    )
  }

  return { customSonner }
}

const styles = {
  success: 'border-[#83E56A]',
  error: 'border-[#F93333]',
  info: 'border-[#388DE2]',
  continue: 'border-[#9b16c7]',
}
