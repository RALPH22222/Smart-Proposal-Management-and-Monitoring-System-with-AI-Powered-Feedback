import Swal from "sweetalert2";

export const promptBudgetUndo = async (sourceName?: string): Promise<boolean> => {
  const label = sourceName?.trim() ? sourceName.trim() : "Untitled source";

  const result = await Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: "info",
    title: `Removed "${label}"`,
    text: "Undo if this was accidental.",
    showConfirmButton: true,
    confirmButtonText: "Undo",
    showCancelButton: true,
    cancelButtonText: "Dismiss",
    timer: 7000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", () => Swal.stopTimer());
      toast.addEventListener("mouseleave", () => Swal.resumeTimer());
    },
  });

  return result.isConfirmed;
};
