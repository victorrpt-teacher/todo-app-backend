from django.db import models

# Create your models here.
class Daylog(models.Model):
    created = models.DateField(auto_now_add=True)
    day_highlights = models.CharField(max_length=255, blank=False)
    highlight = models.BooleanField(default=False)
    owner = models.ForeignKey(
        "auth.User", related_name="daylog", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["created"] 