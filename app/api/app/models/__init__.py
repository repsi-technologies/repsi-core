from app.core.database import Base
from app.models.attendance import (
    Attendance,
    AttendanceMethod,
    ClassAttendance,
    AttendanceQR,
    AttendanceSettings,
    GymLocation,
    BranchAssignment,
    CheckoutType,
    AttendanceStatus,
    AttendanceCorrection,
    MemberPassRedemption,
)
from app.models.auth import AuthIdentity, AuthSession, EmailOtpChallenge, PasswordResetToken, PendingRegistration, PhoneOtpChallenge
from app.models.base import TenantMixin, TimestampMixin
from app.models.finance import CashReconciliation, Expense, Invoice, Payment, PaymentMethod, PaymentStatus, Refund, WorkspaceCounter
from app.models.payment_settings import BusinessPaymentSettings, ManualPaymentSubmission, SubmissionStatus
from app.models.invitation import GymInvitation, InvitationRole, InvitationStatus
from app.models.machine import GymMachine
from app.models.member import Member, Membership, MembershipPlan, MemberStatus
from app.models.member_records import MemberDocument, MemberEvent, MemberNote, MembershipEvent, MembershipFreeze
from app.models.system import Activity, AuditLog, Notification, Report, SavedReport
from app.models.trainer import (
    GymClass,
    Trainer,
    TrainerStatus,
    TrainerClient,
    TrainerClientStatus,
    TrainingSession,
    SessionStatus,
    ClientNote,
)
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.models.workout import Workout, WorkoutPlan, WorkoutStatus
from app.models.fitness import (
    BodyMeasurement,
    Exercise,
    FitnessAssessment,
    MeasurementType,
    WorkoutAssignment,
    WorkoutAssignmentEvent,
    WorkoutDay,
    WorkoutItem,
    WorkoutProgram,
    WorkoutProgramVersion,
    WorkoutSession,
    WorkoutSetLog,
)
from app.models.crm import Lead, LeadActivity, LeadFollowUp, LeadStatus, LeadPriority, FollowUpType, FollowUpStatus
from app.models.website import Website
from app.models.billing import (
    SubscriptionPlan,
    GymSubscription,
    SubscriptionAuditLog,
    SubscriptionPayment,
    BillingInvoice,
    BillingWebhookEvent,
    SubscriptionStatus,
    BillingCycle,
    PaymentStatus as BillingPaymentStatus,
)
from app.models.biometric import BiometricDevice, BiometricDeviceStatus
from app.models.ai import AiResponseCache, AiUsageLog
from app.models.communication import Broadcast, DeviceToken, MessageTemplate, NotificationDelivery, NotificationPreference

__all__ = [
    "AiResponseCache",
    "AiUsageLog",
    "Broadcast",
    "MessageTemplate",
    "NotificationDelivery",
    "NotificationPreference",
    "Activity",
    "Attendance",
    "AttendanceMethod",
    "AuditLog",
    "Base",
    "ClassAttendance",
    "ClientNote",
    "Expense",
    "GymClass",
    "GymInvitation",
    "GymMachine",
    "InvitationRole",
    "InvitationStatus",
    "Invoice",
    "Member",
    "AttendanceCorrection",
    "MemberPassRedemption",
    "MemberEvent",
    "MemberNote",
    "MembershipEvent",
    "MembershipFreeze",
    "MemberStatus",
    "Membership",
    "MembershipPlan",
    "Notification",
    "Payment",
    "PaymentMethod",
    "PaymentStatus",
    "PendingRegistration",
    "Report",
    "SessionStatus",
    "TenantMixin",
    "TimestampMixin",
    "Trainer",
    "TrainerClient",
    "TrainerClientStatus",
    "TrainerStatus",
    "TrainingSession",
    "User",
    "UserRole",
    "Workout",
    "WorkoutPlan",
    "WorkoutStatus",
    "BodyMeasurement",
    "Exercise",
    "FitnessAssessment",
    "MeasurementType",
    "WorkoutAssignment",
    "WorkoutAssignmentEvent",
    "WorkoutDay",
    "WorkoutItem",
    "WorkoutProgram",
    "WorkoutProgramVersion",
    "WorkoutSession",
    "WorkoutSetLog",
    "Workspace",
    "WorkspaceMember",
    "Lead",
    "LeadActivity",
    "LeadFollowUp",
    "LeadStatus",
    "LeadPriority",
    "FollowUpType",
    "FollowUpStatus",
    "Website",
    "SubscriptionPlan",
    "GymSubscription",
    "SubscriptionPayment",
    "BillingInvoice",
    "BillingWebhookEvent",
    "SubscriptionStatus",
    "BillingCycle",
    "BillingPaymentStatus",
    "BiometricDevice",
    "BiometricDeviceStatus",
    "BusinessPaymentSettings",
    "ManualPaymentSubmission",
    "SubmissionStatus",
]



from app.models.booking import ClassBooking, ClassSession, TrainerAvailability, TrainerTimeOff
from app.models.offers import Coupon, CouponRedemption
from app.models.support import SupportMessage, SupportTicket
from app.models.jobs import JobRun
