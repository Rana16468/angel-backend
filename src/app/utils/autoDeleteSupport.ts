import supports from "../modules/support/support.model";

const autoDeleteSupport = async () => {
  try {
    const thirtyMinutesAgo = new Date();

    // Subtract 30 minutes
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const result = await supports.deleteMany({
      isSolve: true,
      updatedAt: { $lte: thirtyMinutesAgo },
    });

    if (result.deletedCount && result.deletedCount > 0) {
      console.log(`✅ Auto-delete: ${result.deletedCount} solved helpdesk records removed.`);
    } else {
      console.log("ℹ️ Auto-delete: No solved helpdesk records found.");
    }
  } catch (error) {
    console.error("❌ Auto-delete helpdesk failed:", error);
  }
};

export default autoDeleteSupport;
